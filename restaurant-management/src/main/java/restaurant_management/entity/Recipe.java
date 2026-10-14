package restaurant_management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Recipe name is required")
    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 1000)
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Availability is required")
    @Builder.Default
    @Column(nullable = false)
    private Boolean available = true;

    @Column(length = 1000)
    private String imageUrl;

    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "100.0")
    @Builder.Default
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(length = 80)
    private String offerTag;

    /** Calculated from current ingredient inventory; never stored in DB. */
    @Transient
    private Integer availableUnits;

    /** Calculated sale price; never stored in DB. */
    @Transient
    private BigDecimal discountedPrice;

    public BigDecimal calculateDiscountedPrice() {
        BigDecimal base = price == null ? BigDecimal.ZERO : price;
        BigDecimal discount = discountPercent == null ? BigDecimal.ZERO : discountPercent;
        if (discount.compareTo(BigDecimal.ZERO) <= 0) return base;
        return base.subtract(base.multiply(discount).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
    }

    public void refreshCalculatedFields(Integer units) {
        this.availableUnits = Math.max(units == null ? 0 : units, 0);
        this.discountedPrice = calculateDiscountedPrice();
    }
}
