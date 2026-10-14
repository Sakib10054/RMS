package restaurant_management.service;

import restaurant_management.entity.Recipe;

import java.util.List;

public interface RecipeService {

    Recipe createRecipe(Recipe recipe);

    Recipe updateRecipe(Long id, Recipe recipe);

    void deleteRecipe(Long id);

    List<Recipe> getAllRecipes();

    Recipe getRecipeById(Long id);

    int getAvailableUnits(Long recipeId);

    Recipe uploadImage(Long recipeId, org.springframework.web.multipart.MultipartFile file);
}