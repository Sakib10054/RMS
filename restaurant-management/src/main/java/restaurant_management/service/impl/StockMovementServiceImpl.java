package restaurant_management.service.impl;

import restaurant_management.entity.StockMovement;
import restaurant_management.repository.StockMovementRepository;
import restaurant_management.service.StockMovementService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockMovementServiceImpl implements StockMovementService {

    private final StockMovementRepository stockMovementRepository;

    public StockMovementServiceImpl(
            StockMovementRepository stockMovementRepository
    ) {
        this.stockMovementRepository = stockMovementRepository;
    }

    @Override
    public List<StockMovement> getAllMovements() {
        return stockMovementRepository.findAll();
    }

    @Override
    public List<StockMovement> getMovementsByIngredient(
            Long ingredientId) {

        return stockMovementRepository
                .findByIngredientId(ingredientId);
    }
}