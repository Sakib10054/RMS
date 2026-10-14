package restaurant_management.controller;

import jakarta.validation.Valid;
import restaurant_management.entity.Recipe;
import restaurant_management.service.RecipeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    @PostMapping
    public ResponseEntity<Recipe> createRecipe(
            @Valid @RequestBody Recipe recipe
    ) {
        Recipe savedRecipe = recipeService.createRecipe(recipe);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedRecipe);
    }


    @PutMapping("/{id}")
    public ResponseEntity<Recipe> updateRecipe(
            @PathVariable Long id,
            @Valid @RequestBody Recipe recipe
    ) {
        return ResponseEntity.ok(recipeService.updateRecipe(id, recipe));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id) {
        recipeService.deleteRecipe(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<Recipe> uploadRecipeImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(recipeService.uploadImage(id, file));
    }

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(
                recipeService.getAllRecipes()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipeById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                recipeService.getRecipeById(id)
        );
    }
}