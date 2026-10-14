package restaurant_management.controller;

import restaurant_management.entity.RecipeIngredient;
import restaurant_management.service.RecipeIngredientService;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/recipes")
public class RecipeIngredientController {

    private final RecipeIngredientService recipeIngredientService;

    public RecipeIngredientController(
            RecipeIngredientService recipeIngredientService
    ) {
        this.recipeIngredientService =
                recipeIngredientService;
    }

    @PostMapping(
            "/{recipeId}/ingredients/{ingredientId}"
    )
    public ResponseEntity<RecipeIngredient>
    addIngredientToRecipe(
            @PathVariable Long recipeId,
            @PathVariable Long ingredientId,
            @RequestParam
            @NotNull(message = "Quantity is required")
            @DecimalMin(
                    value = "0.000001",
                    message = "Quantity must be greater than zero"
            )
            BigDecimal quantity
    ) {

        RecipeIngredient recipeIngredient =
                recipeIngredientService
                        .addIngredientToRecipe(
                                recipeId,
                                ingredientId,
                                quantity
                        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(recipeIngredient);
    }

    @GetMapping(
            "/{recipeId}/ingredients"
    )
    public ResponseEntity<List<RecipeIngredient>>
    getIngredientsByRecipe(
            @PathVariable Long recipeId
    ) {

        return ResponseEntity.ok(
                recipeIngredientService
                        .getIngredientsByRecipe(recipeId)
        );
    }

    @DeleteMapping(
            "/{recipeId}/ingredients/{ingredientId}"
    )
    public ResponseEntity<Void>
    removeIngredientFromRecipe(
            @PathVariable Long recipeId,
            @PathVariable Long ingredientId
    ) {

        recipeIngredientService
                .removeIngredientFromRecipe(
                        recipeId,
                        ingredientId
                );

        return ResponseEntity.noContent().build();
    }
}