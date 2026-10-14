package restaurant_management.service;

import restaurant_management.entity.RecipeIngredient;

import java.math.BigDecimal;
import java.util.List;

public interface RecipeIngredientService {

    RecipeIngredient addIngredientToRecipe(
            Long recipeId,
            Long ingredientId,
            BigDecimal quantity
    );

    List<RecipeIngredient> getIngredientsByRecipe(
            Long recipeId
    );

    void removeIngredientFromRecipe(
            Long recipeId,
            Long ingredientId
    );
}