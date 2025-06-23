import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
function Navbar() {

    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [network, setNetwork] = useState(null);
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        //set up metamask listeners
        const initializeWallet = async () => {
            if (window.ethereum) {
                const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(ethProvider);

                //get accounts
                const accounts = await ethProvider.listAccounts();
                if (accounts.length > 0) {
                    const connectedAccount = accounts[0];
                    setAccount(connectedAccount);
                    const currentSigner = ethProvider.getSigner(connectedAccount);
                    setSigner(currentSigner);
                    updateAccountInfo(connectedAccount, ethProvider);
                }

                // Set up event listeners for account and network changes
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);
                window.ethereum.on('disconnect', handleDisconnect);

            } else {
                setError('MetaMask is not installed. Please install it to use this dApp.');
            }
        };

        initializeWallet();

        // Cleanup function for event listeners
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('disconnect', handleDisconnect);
            }
        };
    }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

    const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
            // MetaMask is locked or the user has disconnected all accounts
            console.log('MetaMask disconnected.');
            resetWalletState();
        } else {
            const newAccount = accounts[0];
            setAccount(newAccount);
            if (provider) {
                const newSigner = provider.getSigner(newAccount);
                setSigner(newSigner);
                updateAccountInfo(newAccount, provider);
            }
        }
    };

    const handleChainChanged = (chainId) => {
        console.log('Network changed to:', chainId);
        // It's often recommended to reload the page on network change
        // to ensure the dApp logic is consistent with the new network.
        window.location.reload();
    };

    const handleDisconnect = (error) => {
        console.error('MetaMask disconnected due to:', error);
        resetWalletState();
        setError(`MetaMask disconnected: ${error.message}`);
    };

    const resetWalletState = () => {
        setAccount(null);
        setSigner(null);
        setNetwork(null);
        setBalance(null);
    };

    const updateAccountInfo = async (currentAccount, currentProvider) => {
        try {
            const networkData = await currentProvider.getNetwork();
            setNetwork(networkData);

            const balanceWei = await currentProvider.getBalance(currentAccount);
            setBalance(ethers.utils.formatEther(balanceWei)); // Format balance to ETH
        } catch (err) {
            console.error('Error updating account info:', err);
            setError('Could not fetch account information.');
        }
    };

    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                setError('MetaMask is not installed. Please install it.');
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const connectedAccount = accounts[0];
            setAccount(connectedAccount);

            const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(ethProvider);
            const currentSigner = ethProvider.getSigner(connectedAccount);
            setSigner(currentSigner);

            updateAccountInfo(connectedAccount, ethProvider);
            setError(null); // Clear any previous errors

        } catch (err) {
            if (err.code === 4001) {
                // User rejected connection
                setError('Connection rejected by user.');
            } else {
                setError(`Error connecting to MetaMask: ${err.message}`);
                console.error(err);
            }
        }
    };

    const state = useSelector(state => state.handleCart)
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light py-3 sticky-top">
            <div className="container">
                <NavLink className="navbar-brand fw-bold fs-4 px-2" to="/"> React Ecommerce</NavLink>
                <button className="navbar-toggler mx-2" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav m-auto my-2 text-center">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/">Home </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/product">Products</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/about">About</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/contact">Contact</NavLink>
                        </li>
                    </ul>
                    {/*
                    <div className="buttons text-center">
                        <NavLink to="/login" className="btn btn-outline-dark m-2"><i className="fa fa-sign-in-alt mr-1"></i> Login</NavLink>
                        <NavLink to="/register" className="btn btn-outline-dark m-2"><i className="fa fa-user-plus mr-1"></i> Register</NavLink>
                        <NavLink to="/cart" className="btn btn-outline-dark m-2"><i className="fa fa-cart-shopping mr-1"></i> Cart ({state.length}) </NavLink>
                    </div>
                    */}
                </div>



                <div>
                    {!account ? (
                        <button
                            onClick={connectWallet}
                            style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Connect MetaMask
                        </button>
                    ) : (
                        <div>
                            <p><strong>Connected Account:</strong> {account}</p>
                            {network && (
                                <p><strong>Network:</strong> {network.name} (Chain ID: {network.chainId})</p>
                            )}
                            {balance && (
                                <p><strong>Balance:</strong> {balance} ETH</p>
                            )}
                            {/* Example of using the signer for a transaction (simplified) */}
                            {signer && (
                                <button className="btn btn-outline-dark m-2"
                                    onClick={async () => {
                                        try {
                                            // This is just an example, make sure the recipient address is valid
                                            const tx = await signer.sendTransaction({
                                                to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Replace Production Address
                                                value: ethers.utils.parseEther('1'), // Send 1 ETH
                                            });
                                            console.log('Transaction sent:', tx.hash);
                                            alert(`Transaction sent! Hash: ${tx.hash}`);
                                        } catch (txError) {
                                            console.error('Transaction error:', txError);
                                            alert(`Transaction failed: ${txError.message}`);
                                        }
                                    }}
                                    style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                >
                                    Send 1 ETH (Example)
                                </button>
                            )}
                        </div>
                    )}
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
                </div>
            </div>
        </nav >
    )

}
export default Navbar;