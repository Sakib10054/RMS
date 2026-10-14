package restaurant_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Ingredient is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    @Column(
            nullable = false,
            precision = 19,
            scale = 6
    )
    private BigDecimal quantity;

    @NotNull(message = "Unit price is required")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Unit price cannot be negative"
    )
    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal unitPrice;

    @NotNull(message = "Total price is required")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Total price cannot be negative"
    )
    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal totalPrice;

    private String supplier;

    @NotNull(message = "Purchase date is required")
    @Column(nullable = false)
    private LocalDate purchaseDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}