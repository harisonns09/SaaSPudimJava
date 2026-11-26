package com.pudim.exception;

public class StoreInactiveException extends RuntimeException {
    public StoreInactiveException(String message) {
        super(message);
    }
}
