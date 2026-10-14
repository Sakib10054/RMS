package restaurant_management.entity;

import restaurant_management.enums.StockAlertStatus;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Ingredient is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "ingredient_id",
            nullable = false
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

    @NotNull(message = "Alert status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StockAlertStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}