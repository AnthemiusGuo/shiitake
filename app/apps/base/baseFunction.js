function isset(val)  
{  
    if (typeof val !== 'undefined' && val != null)   
    {  
        return true;  
    }  
  
    return false;  
} 

module.export = isset;