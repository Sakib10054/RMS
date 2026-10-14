package restaurant_management.service.impl;

import restaurant_management.entity.Inventory;
import restaurant_management.entity.Recipe;
import restaurant_management.entity.RecipeIngredient;
import restaurant_management.repository.InventoryRepository;
import restaurant_management.repository.RecipeIngredientRepository;
import restaurant_management.repository.RecipeRepository;
import restaurant_management.service.RecipeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

@Service
public class RecipeServiceImpl implements RecipeService {
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final InventoryRepository inventoryRepository;

    public RecipeServiceImpl(RecipeRepository recipeRepository,
                             RecipeIngredientRepository recipeIngredientRepository,
                             InventoryRepository inventoryRepository) {
        this.recipeRepository = recipeRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public Recipe createRecipe(Recipe recipe) {
        if (recipeRepository.existsByName(recipe.getName())) {
            throw new IllegalArgumentException("Recipe already exists");
        }
        if (recipe.getDiscountPercent() == null) recipe.setDiscountPercent(BigDecimal.ZERO);
        if (recipe.getDiscountPercent().compareTo(BigDecimal.ZERO) < 0 || recipe.getDiscountPercent().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Discount must be between 0 and 100 percent");
        }
        return recipeRepository.save(recipe);
    }

    @Override
    @Transactional
    public Recipe updateRecipe(Long id, Recipe incoming) {
        if (incoming == null) {
            throw new IllegalArgumentException("Recipe data is required");
        }
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with id: " + id));

        if (incoming.getName() == null || incoming.getName().isBlank()) {
            throw new IllegalArgumentException("Recipe name is required");
        }
        recipeRepository.findByName(incoming.getName().trim()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Recipe already exists");
            }
        });

        BigDecimal discount = incoming.getDiscountPercent() == null ? BigDecimal.ZERO : incoming.getDiscountPercent();
        if (discount.compareTo(BigDecimal.ZERO) < 0 || discount.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Discount must be between 0 and 100 percent");
        }

        recipe.setName(incoming.getName().trim());
        recipe.setDescription(incoming.getDescription());
        recipe.setPrice(incoming.getPrice());
        recipe.setAvailable(incoming.getAvailable() == null || incoming.getAvailable());
        recipe.setDiscountPercent(discount);
        recipe.setOfferTag(incoming.getOfferTag());
        if (incoming.getImageUrl() != null && !incoming.getImageUrl().isBlank()) {
            recipe.setImageUrl(incoming.getImageUrl());
        }
        return recipeRepository.save(recipe);
    }

    @Override
    @Transactional
    public void deleteRecipe(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with id: " + id));
        recipeIngredientRepository.deleteByRecipeId(id);
        recipeRepository.delete(recipe);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Recipe> getAllRecipes() {
        return recipeRepository.findAll().stream().peek(this::enrichAvailability).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Recipe getRecipeById(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with id: " + id));
        enrichAvailability(recipe);
        return recipe;
    }

    @Override
    @Transactional
    public Recipe uploadImage(Long recipeId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Recipe image file is required");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!List.of("image/jpeg", "image/png", "image/webp", "image/gif").contains(contentType)) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP or GIF images are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Recipe image must be 5MB or smaller");
        }

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with id: " + recipeId));

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };

        Path uploadDir = Path.of("uploads", "recipes").toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadDir);
            String filename = UUID.randomUUID() + extension;
            Path target = uploadDir.resolve(filename).normalize();
            if (!target.getParent().equals(uploadDir)) {
                throw new IllegalArgumentException("Invalid image path");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            recipe.setImageUrl("/uploads/recipes/" + filename);
            return recipeRepository.save(recipe);
        } catch (java.io.IOException ex) {
            throw new IllegalStateException("Could not store recipe image", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public int getAvailableUnits(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));
        enrichAvailability(recipe);
        return recipe.getAvailableUnits() == null ? 0 : recipe.getAvailableUnits();
    }

    private void enrichAvailability(Recipe recipe) {
        List<RecipeIngredient> ingredients = recipeIngredientRepository.findByRecipeId(recipe.getId());
        if (!Boolean.TRUE.equals(recipe.getAvailable()) || ingredients.isEmpty()) {
            recipe.refreshCalculatedFields(0);
            return;
        }

        int units = Integer.MAX_VALUE;
        for (RecipeIngredient ri : ingredients) {
            Inventory inventory = inventoryRepository.findByIngredientId(ri.getIngredient().getId()).orElse(null);
            if (inventory == null || inventory.getCurrentQuantity() == null || ri.getQuantity() == null
                    || ri.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                units = 0;
                break;
            }
            BigDecimal possible = inventory.getCurrentQuantity().divide(ri.getQuantity(), 0, RoundingMode.FLOOR);
            try {
                units = Math.min(units, possible.intValueExact());
            } catch (ArithmeticException ex) {
                units = Math.min(units, Integer.MAX_VALUE);
            }
        }
        recipe.refreshCalculatedFields(units == Integer.MAX_VALUE ? 0 : units);
    }
}
