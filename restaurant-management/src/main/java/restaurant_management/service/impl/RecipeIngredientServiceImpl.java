package restaurant_management.service.impl;

import restaurant_management.entity.Ingredient;
import restaurant_management.entity.Recipe;
import restaurant_management.entity.RecipeIngredient;
import restaurant_management.repository.IngredientRepository;
import restaurant_management.repository.RecipeIngredientRepository;
import restaurant_management.repository.RecipeRepository;
import restaurant_management.service.RecipeIngredientService;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RecipeIngredientServiceImpl
        implements RecipeIngredientService {

    private final RecipeIngredientRepository
            recipeIngredientRepository;

    private final RecipeRepository recipeRepository;

    private final IngredientRepository ingredientRepository;

    public RecipeIngredientServiceImpl(
            RecipeIngredientRepository recipeIngredientRepository,
            RecipeRepository recipeRepository,
            IngredientRepository ingredientRepository
    ) {
        this.recipeIngredientRepository =
                recipeIngredientRepository;

        this.recipeRepository =
                recipeRepository;

        this.ingredientRepository =
                ingredientRepository;
    }

    @Override
    public RecipeIngredient addIngredientToRecipe(
            Long recipeId,
            Long ingredientId,
            BigDecimal quantity
    ) {

        if (quantity == null
                || quantity.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Quantity must be greater than zero"
            );
        }

        Recipe recipe =
                recipeRepository.findById(recipeId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Recipe not found with id: "
                                                + recipeId
                                )
                        );

        Ingredient ingredient =
                ingredientRepository.findById(ingredientId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Ingredient not found with id: "
                                                + ingredientId
                                )
                        );

        if (recipeIngredientRepository
                .findByRecipeIdAndIngredientId(
                        recipeId,
                        ingredientId
                )
                .isPresent()) {

            throw new IllegalArgumentException(
                    "Ingredient is already added to this recipe"
            );
        }

        RecipeIngredient recipeIngredient =
                RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredient(ingredient)
                        .quantity(quantity)
                        .build();

        return recipeIngredientRepository.save(
                recipeIngredient
        );
    }

    @Override
    public List<RecipeIngredient> getIngredientsByRecipe(
            Long recipeId) {

        if (!recipeRepository.existsById(recipeId)) {
            throw new IllegalArgumentException(
                    "Recipe not found with id: " + recipeId
            );
        }

        return recipeIngredientRepository
                .findByRecipeId(recipeId);
    }

    @Override
    public void removeIngredientFromRecipe(
            Long recipeId,
            Long ingredientId
    ) {

        RecipeIngredient recipeIngredient =
                recipeIngredientRepository
                        .findByRecipeIdAndIngredientId(
                                recipeId,
                                ingredientId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Ingredient is not assigned "
                                                + "to this recipe"
                                )
                        );

        recipeIngredientRepository.delete(
                recipeIngredient
        );
    }
}