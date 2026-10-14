package restaurant_management.service.impl;


import restaurant_management.entity.User;
import restaurant_management.enums.Role;
import restaurant_management.repository.UserRepository;
import restaurant_management.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User registerUser(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if (user.getRole() == null) {
            user.setRole(Role.CUSTOMER);
        }

        user.setActive(true);

        return userRepository.save(user);
    }

    @Override
    public User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found with email: " + email
                        )
                );
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }


    @Override
    public User updateUserAccess(
            Long userId,
            Role role,
            Boolean active
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found with id: " + userId)
                );

        user.setRole(role);
        user.setActive(active);

        return userRepository.save(user);
    }


    @Override
    public User createUser(User user) {
        return registerUser(user);
    }
}