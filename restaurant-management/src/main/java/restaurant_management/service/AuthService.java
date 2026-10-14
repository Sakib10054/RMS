package restaurant_management.service;


import restaurant_management.dto.LoginRequest;
import restaurant_management.dto.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);
}