package restaurant_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "recipe_ingredients",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "recipe_id",
                                "ingredient_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Recipe is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "recipe_id",
            nullable = false
    )
    private Recipe recipe;

    @NotNull(message = "Ingredient is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "ingredient_id",
            nullable = false
    )
    private Ingredient ingredient;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    @Column(
            nullable = false,
            precision = 19,
            scale = 6
    )
    private BigDecimal quantity;
}