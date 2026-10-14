package restaurant_management.service;

import restaurant_management.entity.Ingredient;

import java.util.List;

public interface IngredientService {

    Ingredient createIngredient(Ingredient ingredient);

    List<Ingredient> getAllIngredients();

    Ingredient getIngredientById(Long id);
}