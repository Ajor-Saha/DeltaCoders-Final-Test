import dotenv from 'dotenv';
dotenv.config();

export const env = {
    ENDPOINT_URL: process.env.ENDPOINT_URL,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
};
  

