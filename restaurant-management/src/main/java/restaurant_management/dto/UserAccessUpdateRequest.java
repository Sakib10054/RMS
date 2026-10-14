
package restaurant_management.dto;

import restaurant_management.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAccessUpdateRequest {

    @NotNull(message = "Role is required")
    private Role role;

    @NotNull(message = "Active status is required")
    private Boolean active;
}