package com.pudim.dto;

public class RegistrationRequest {
    private String email;
    private String password;
    private String storeName;
    private boolean aceiteTermos;

    public boolean isAceiteTermos() {
        return aceiteTermos;
    }

    public void setAceiteTermos(boolean aceiteTermos) {
        this.aceiteTermos = aceiteTermos;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }
}
