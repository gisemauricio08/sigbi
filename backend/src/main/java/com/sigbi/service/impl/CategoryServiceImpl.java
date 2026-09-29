package com.sigbi.service.impl;

import com.sigbi.exception.BusinessRuleException;
import com.sigbi.model.Category;
import com.sigbi.repo.IBookRepo;
import com.sigbi.repo.ICategoryRepo;
import com.sigbi.repo.IGenericRepo;
import com.sigbi.service.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl extends CRUDImpl<Category, Integer> implements ICategoryService {

    private final ICategoryRepo repo;
    private final IBookRepo bookRepo;
    private final MessageSource messageSource;

    @Override
    protected IGenericRepo<Category, Integer> getRepo() {
        return repo;
    }

    //La FK ya lo impide, pero la base respondería 500 con la traza del driver
    @Override
    public void delete(Integer id) throws Exception {
        findById(id);

        long books = bookRepo.countByCategoryIdCategory(id);
        if (books > 0) {
            throw new BusinessRuleException(messageSource.getMessage(
                    "category.delete.hasBooks", new Object[]{books}, LocaleContextHolder.getLocale()));
        }

        super.delete(id);
    }

    @Override
    public Map<Integer, Long> bookCountByCategory() throws Exception {
        List<Object[]> rows = bookRepo.countGroupedByCategory();

        Map<Integer, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((Integer) row[0], (Long) row[1]);
        }

        return counts;
    }

    @Override
    public long countBooks(Integer idCategory) throws Exception {
        return bookRepo.countByCategoryIdCategory(idCategory);
    }
}
