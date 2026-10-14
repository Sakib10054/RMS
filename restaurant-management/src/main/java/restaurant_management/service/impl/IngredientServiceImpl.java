
package restaurant_management.service.impl;

import restaurant_management.entity.Ingredient;
import restaurant_management.entity.Inventory;
import restaurant_management.repository.IngredientRepository;
import restaurant_management.repository.InventoryRepository;
import restaurant_management.service.IngredientService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class IngredientServiceImpl implements IngredientService {

    private static final Logger log =
            LoggerFactory.getLogger(IngredientServiceImpl.class);

    private final IngredientRepository ingredientRepository;
    private final InventoryRepository inventoryRepository;

    public IngredientServiceImpl(
            IngredientRepository ingredientRepository,
            InventoryRepository inventoryRepository) {
        this.ingredientRepository = ingredientRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    @Transactional
    public Ingredient createIngredient(Ingredient ingredient) {

        if (ingredient == null) {
            throw new IllegalArgumentException("Ingredient is required");
        }

        if (ingredient.getName() == null
                || ingredient.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Ingredient name is required");
        }

        if (ingredient.getUnit() == null
                || ingredient.getUnit().trim().isEmpty()) {
            throw new IllegalArgumentException("Unit is required");
        }

        if (ingredient.getMinimumStock() == null
                || ingredient.getMinimumStock().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Minimum stock is required and cannot be negative");
        }

        String ingredientName = ingredient.getName().trim();
        String unit = ingredient.getUnit().trim();

        ingredient.setName(ingredientName);
        ingredient.setUnit(unit);

        if (ingredientRepository.existsByName(ingredientName)) {
            throw new IllegalArgumentException(
                    "Ingredient already exists: " + ingredientName);
        }

        try {
            Ingredient savedIngredient =
                    ingredientRepository.saveAndFlush(ingredient);

            if (savedIngredient.getId() == null) {
                throw new IllegalStateException(
                        "Ingredient ID was not generated");
            }

            if (inventoryRepository.existsByIngredientId(
                    savedIngredient.getId())) {
                throw new IllegalStateException(
                        "Inventory already exists for ingredient ID: "
                                + savedIngredient.getId());
            }

            Inventory inventory = Inventory.builder()
                    .ingredient(savedIngredient)
                    .currentQuantity(BigDecimal.ZERO)
                    .lastUpdated(LocalDateTime.now())
                    .build();

            inventoryRepository.saveAndFlush(inventory);

            return savedIngredient;

        } catch (DataIntegrityViolationException ex) {

            Throwable rootCause = ex.getMostSpecificCause();

            log.error(
                    "Database constraint error while creating ingredient '{}': {}",
                    ingredientName,
                    rootCause != null
                            ? rootCause.getMessage()
                            : ex.getMessage(),
                    ex);

            throw new IllegalStateException(
                    "Could not create ingredient and inventory. "
                            + "Check the backend log for the database cause.",
                    ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ingredient> getAllIngredients() {
        return ingredientRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Ingredient getIngredientById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException("Ingredient ID is required");
        }

        return ingredientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Ingredient not found with ID: " + id));
    }
}
