package restaurant_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Ingredient is required")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "ingredient_id",
            nullable = false,
            unique = true
    )
    private Ingredient ingredient;

    @NotNull(message = "Current quantity is required")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Current quantity cannot be negative"
    )
    @Column(
            nullable = false,
            precision = 19,
            scale = 6
    )
    private BigDecimal currentQuantity;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;

    @PrePersist
    protected void onCreate() {
        lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}