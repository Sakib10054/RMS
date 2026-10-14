
package restaurant_management.service;

import restaurant_management.entity.User;
import restaurant_management.enums.Role;

import java.util.List;

public interface UserService {

    User registerUser(User user);

    User getUserByEmail(String email);

    List<User> getAllUsers();

    User updateUserAccess(Long userId, Role role, Boolean active);

    User createUser(User user);
}