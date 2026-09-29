package com.sigbi.exception;

//El 404 lo pone ResponseExceptionHandler y no @ResponseStatus, para que salga con CustomErrorTemplate
public class ModelNotFoundException extends RuntimeException {

    public ModelNotFoundException(String message) {
        super(message);
    }
}
