package restaurant_management.controller;

import jakarta.validation.Valid;
import restaurant_management.entity.Ingredient;
import restaurant_management.service.IngredientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
public class IngredientController {

    private final IngredientService ingredientService;

    public IngredientController(
            IngredientService ingredientService
    ) {
        this.ingredientService = ingredientService;
    }

    @PostMapping
    public ResponseEntity<Ingredient> createIngredient(
            @Valid @RequestBody Ingredient ingredient
    ) {
        Ingredient savedIngredient =
                ingredientService.createIngredient(ingredient);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedIngredient);
    }

    @GetMapping
    public ResponseEntity<List<Ingredient>> getAllIngredients() {
        return ResponseEntity.ok(
                ingredientService.getAllIngredients()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ingredient> getIngredientById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ingredientService.getIngredientById(id)
        );
    }
}