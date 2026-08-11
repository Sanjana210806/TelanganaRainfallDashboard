import axios from "axios";


const apiClient = axios.create({

    baseURL:
        "http://127.0.0.1:8002/api/rainfall",

    headers: {
        "Content-Type": "application/json",
    },

});


export default apiClient;