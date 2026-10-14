package restaurant_management.repository;

import restaurant_management.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecipeIngredientRepository
        extends JpaRepository<RecipeIngredient, Long> {

    List<RecipeIngredient> findByRecipeId(Long recipeId);

    void deleteByRecipeId(Long recipeId);

    Optional<RecipeIngredient> findByRecipeIdAndIngredientId(
            Long recipeId,
            Long ingredientId
    );
}