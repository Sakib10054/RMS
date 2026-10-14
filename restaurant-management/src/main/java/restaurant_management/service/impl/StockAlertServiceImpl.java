package restaurant_management.service.impl;

import restaurant_management.entity.Ingredient;
import restaurant_management.entity.StockAlert;
import restaurant_management.enums.StockAlertStatus;
import restaurant_management.repository.StockAlertRepository;
import restaurant_management.service.StockAlertService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockAlertServiceImpl
        implements StockAlertService {

    private final StockAlertRepository stockAlertRepository;

    public StockAlertServiceImpl(
            StockAlertRepository stockAlertRepository
    ) {
        this.stockAlertRepository = stockAlertRepository;
    }

    @Override
    public List<StockAlert> getAllAlerts() {
        return stockAlertRepository.findAll();
    }

    @Override
    public List<StockAlert> getActiveAlerts() {
        return stockAlertRepository.findByStatus(
                StockAlertStatus.ACTIVE
        );
    }

    @Override
    @Transactional
    public StockAlert resolveAlert(Long id) {

        StockAlert alert =
                stockAlertRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Stock alert not found with id: "
                                                + id
                                )
                        );

        if (alert.getStatus()
                == StockAlertStatus.RESOLVED) {

            return alert;
        }

        alert.setStatus(
                StockAlertStatus.RESOLVED
        );

        alert.setResolvedAt(
                LocalDateTime.now()
        );

        return stockAlertRepository.save(alert);
    }

    @Override
    @Transactional
    public void checkAndCreateAlert(
            Ingredient ingredient,
            BigDecimal currentQuantity
    ) {

        if (ingredient == null
                || ingredient.getId() == null
                || currentQuantity == null
                || ingredient.getMinimumStock() == null) {

            return;
        }

        Long ingredientId =
                ingredient.getId();

        BigDecimal minimumStock =
                ingredient.getMinimumStock();

        // =====================================================
        // LOW / OUT OF STOCK
        // =====================================================

        if (currentQuantity.compareTo(
                minimumStock
        ) <= 0) {

            List<StockAlert> activeAlerts =
                    stockAlertRepository
                            .findByIngredientIdAndStatus(
                                    ingredientId,
                                    StockAlertStatus.ACTIVE
                            );

            if (!activeAlerts.isEmpty()) {

                for (StockAlert alert :
                        activeAlerts) {

                    alert.setCurrentQuantity(
                            currentQuantity
                    );

                    alert.setMinimumStock(
                            minimumStock
                    );

                    stockAlertRepository.save(
                            alert
                    );
                }

                return;
            }

            StockAlert alert =
                    StockAlert.builder()
                            .ingredient(ingredient)
                            .currentQuantity(
                                    currentQuantity
                            )
                            .minimumStock(
                                    minimumStock
                            )
                            .status(
                                    StockAlertStatus.ACTIVE
                            )
                            .build();

            stockAlertRepository.save(alert);

            return;
        }

        // =====================================================
        // STOCK RECOVERED
        // =====================================================

        List<StockAlert> activeAlerts =
                stockAlertRepository
                        .findByIngredientIdAndStatus(
                                ingredientId,
                                StockAlertStatus.ACTIVE
                        );

        if (!activeAlerts.isEmpty()) {

            LocalDateTime resolvedTime =
                    LocalDateTime.now();

            for (StockAlert alert :
                    activeAlerts) {

                alert.setCurrentQuantity(
                        currentQuantity
                );

                alert.setMinimumStock(
                        minimumStock
                );

                alert.setStatus(
                        StockAlertStatus.RESOLVED
                );

                alert.setResolvedAt(
                        resolvedTime
                );

                stockAlertRepository.save(
                        alert
                );
            }
        }
    }
}