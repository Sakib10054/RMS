package restaurant_management.dto;


import restaurant_management.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private Boolean active;
    private LocalDateTime createdAt;
}