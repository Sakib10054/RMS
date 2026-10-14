package restaurant_management.service.impl;

import restaurant_management.repository.OrderItemRepository;
import restaurant_management.service.BestSellingReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BestSellingReportServiceImpl
        implements BestSellingReportService {

    private final OrderItemRepository orderItemRepository;

    public BestSellingReportServiceImpl(
            OrderItemRepository orderItemRepository) {
        this.orderItemRepository = orderItemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Object[]> getBestSellingRecipes() {
        return orderItemRepository.findBestSellingRecipes();
    }
}