import { Response } from "express"

export const validationError=(res:Response, message:String)=>{
    let result ={
        success: false,
        message,
        data:null
    }
    return res.status(400).json(result);
}


export const successResponse=(res:Response, message:String, data?:any)=>{
    let result ={
        success: false,
        message,
        data:data
    }
    return res.status(200).json(result);
}

export const errorResponse=(res:Response, message:String)=>{
    let result ={
        success: false,
        message,
        data:null
    }
    return res.status(500).json(result);
}