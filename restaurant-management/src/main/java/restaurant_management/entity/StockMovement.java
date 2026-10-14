package restaurant_management.entity;

import restaurant_management.enums.StockMovementType;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {

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

    @NotNull(message = "Movement type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StockMovementType type;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    @Column(
            nullable = false,
            precision = 19,
            scale = 6
    )
    private BigDecimal quantity;

    private Long referenceId;

    @Column(nullable = false)
    private LocalDateTime date;

    private String note;

    @PrePersist
    protected void onCreate() {
        date = LocalDateTime.now();
    }
}