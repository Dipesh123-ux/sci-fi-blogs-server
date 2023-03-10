const uniqueMessage = error =>{
    let output ;

try{
    let fieldName = error.message.substring(error.message.lastIndexOf('.$')+2,error.message.lastIndexOf('_1'));
    output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + 'already exists'
}
catch(ex){
   output = 'Unique field already exists'
}
};

exports.errorHandler = error =>{

    let message = '';

    if(error.code){
         switch(error.code){
        case 110000:
        case 11001:
            message = uniqueMessage(error)
            break;
        default:
            message = 'Something went wrong'

    }
    }
    else{
        for(let errorName in error.errorors){
            if(error.errorors[errorName].message) message = error.erroros[errorName].message;
        }
    }
   
}