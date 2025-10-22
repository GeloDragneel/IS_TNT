<?php

use Illuminate\Support\Facades\Route;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Route::post('/login', [App\Http\Controllers\CustomAuthController::class,'loginUser'])->name(name: 'login');

// Route::get('/registration',[App\Http\Controllers\CustomAuthController::class,'registration'])->middleware('DoneLoggedIn'); // Registration Landing Page Router
// Route::post('/register-user',[App\Http\Controllers\CustomAuthController::class,'registerUser'])->name('register-user'); // Registration of User Router

// Route::get('/login',[App\Http\Controllers\CustomAuthController::class,'login'])->middleware('DoneLoggedIn'); // Login Landing Page Router
// Route::post('/login-user',[App\Http\Controllers\CustomAuthController::class,'loginUser'])->name('login-user'); // Login of User Router
// Route::get('/logout',[App\Http\Controllers\CustomAuthController::class,'logout']); // Logout Router

// Route::get('/dashboard',[App\Http\Controllers\CustomAuthController::class,'dashboard'])->middleware('isLoggedIn'); // Dashboard Landing Page Router

// Route::get('/categories',[App\Http\Controllers\CategoriesController::class,'categories']); // Categories Router
// Route::delete('/categories/{id}', [App\Http\Controllers\CategoriesController::class, 'deleteCategory'])->name('delete-category');
// Route::post('/store-category',[App\Http\Controllers\CategoriesController::class,'storeCategory'])->name('store-category');
// Route::put('/update-category', [App\Http\Controllers\CategoriesController::class, 'updateCategory'])->name('update-category');

// Route::get('/tasks',[App\Http\Controllers\TasksController::class,'tasks'])->name('tasks'); // Tasks Router
// Route::post('/store-tasks',[App\Http\Controllers\TasksController::class,'storeTasks'])->name('store-tasks');
// Route::put('/update-tasks',[App\Http\Controllers\TasksController::class,'updateTasks'])->name('update-tasks');
// Route::delete('/tasks/{id}', [App\Http\Controllers\TasksController::class, 'deleteTasks'])->name('delete-tasks');