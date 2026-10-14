package restaurant_management.controller;

import restaurant_management.dto.UserResponse;
import restaurant_management.entity.User;
import restaurant_management.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import restaurant_management.dto.UserAccessUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import restaurant_management.dto.CreateUserRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            Authentication authentication
    ) {
        String email = authentication.getName();

        User user = userService.getUserByEmail(email);

        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();

        return ResponseEntity.ok(response);
    }


    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        List<UserResponse> users = userService.getAllUsers()
                .stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole())
                        .active(user.getActive())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(users);
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/customer-area")
    public ResponseEntity<String> customerArea(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                "Customer area: " + authentication.getName()
        );
    }


    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping("/{userId}/access")
    public ResponseEntity<UserResponse> updateUserAccess(
            @PathVariable Long userId,
            @Valid @RequestBody UserAccessUpdateRequest request
    ) {
        User user = userService.updateUserAccess(
                userId,
                request.getRole(),
                request.getActive()
        );

        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }


    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request
    ) {
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(request.password())
                .phone(request.phone())
                .role(request.role())
                .build();

        User savedUser = userService.createUser(user);

        UserResponse response = UserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .role(savedUser.getRole())
                .active(savedUser.getActive())
                .createdAt(savedUser.getCreatedAt())
                .build();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}