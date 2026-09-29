package com.sigbi.service.impl;

import com.sigbi.exception.ModelNotFoundException;
import com.sigbi.repo.IGenericRepo;
import com.sigbi.service.ICRUD;

import java.lang.reflect.Method;
import java.util.List;

public abstract class CRUDImpl<T, ID> implements ICRUD<T, ID> {

    protected abstract IGenericRepo<T, ID> getRepo();

    @Override
    public T save(T entity) throws Exception {
        return getRepo().save(entity);
    }

    @Override
    public T update(ID id, T entity) throws Exception {
        getRepo().findById(id).orElseThrow(() -> new ModelNotFoundException("ID NOT FOUND: " + id));

        //Reflexión sobre setId<ClassName>: la clave primaria de cada entidad tiene que llamarse
        //exactamente id + nombre de la clase, o esto falla en ejecución
        String className = entity.getClass().getSimpleName();
        String methodName = "setId" + className;
        Method setIdMethod = entity.getClass().getMethod(methodName, id.getClass());
        setIdMethod.invoke(entity, id);

        return getRepo().save(entity);
    }

    @Override
    public List<T> findAll() throws Exception {
        return getRepo().findAll();
    }

    @Override
    public T findById(ID id) throws Exception {
        return getRepo().findById(id).orElseThrow(() -> new ModelNotFoundException("ID NOT FOUND: " + id));
    }

    @Override
    public void delete(ID id) throws Exception {
        getRepo().findById(id).orElseThrow(() -> new ModelNotFoundException("ID NOT FOUND: " + id));
        getRepo().deleteById(id);
    }

}
