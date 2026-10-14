package restaurant_management.service;

import restaurant_management.entity.StockMovement;

import java.util.List;

public interface StockMovementService {

    List<StockMovement> getAllMovements();

    List<StockMovement> getMovementsByIngredient(Long ingredientId);
}