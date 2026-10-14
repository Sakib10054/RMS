package restaurant_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ingredients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Ingredient name is required")
    @Column(nullable = false, unique = true)
    private String name;

    @NotBlank(message = "Unit is required")
    @Column(nullable = false)
    private String unit;

    @NotNull(message = "Minimum stock is required")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Minimum stock cannot be negative"
    )
    @Column(
            nullable = false,
            precision = 19,
            scale = 6
    )
    private BigDecimal minimumStock;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}