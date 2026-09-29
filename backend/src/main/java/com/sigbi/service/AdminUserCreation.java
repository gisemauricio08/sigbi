package com.sigbi.service;

import com.sigbi.model.User;

//linked: la identidad de Supabase ya existía y se vinculó (R-10)
public record AdminUserCreation(User user, boolean linked) {
}
