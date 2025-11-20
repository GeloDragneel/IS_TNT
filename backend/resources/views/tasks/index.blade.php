@extends('layouts.main')
@section('maincontent')
    <div class="row">
        <div class="col-md-4">
            <div class="panel panel-primary">
                <div class="panel-heading clearfix">
                    <h3 class="panel-title pull-left">Tasks</h3>
                    <button class="btn btn-xs btn-success pull-right" id="addTasksBtn">Add</button>
                </div>
                <div class="panel-body">
                    <div class="list-group mt-5">
                        @foreach ($tasks as $item)
                            <a href="#" class="list-group-item task-item" data-id="{{ $item->id }}" data-name="{{ $item->task_name }}" data-category_id="{{ $item->category->id }}" data-priority_id="{{ $item->priority->id }}">
                                <p class="list-group-item-text">{{$item->category->category_name}} : {{$item->task_name}} <span class="badge badge-info">{{$item->priority->description}}</span></p>
                                <button class="btn btn-xs btn-danger pull-right open-delete-task" style="position: absolute;right: 5%;top: 20%;" data-id="{{ $item->id }}" data-name="{{ $item->task_name }}">Delete</button>
                            </a>
                        @endforeach
                    </div>
                    <div class="text-center">
                        {{ $tasks->links() }}
                    </div>
                </div>
            </div>
            <div class="panel panel-primary">
                <div class="panel-heading clearfix">
                    <h3 class="panel-title pull-left">Category</h3>
                    <button class="btn btn-xs btn-success pull-right" id="addCategoryBtn">Add</button>
                </div>
                <div class="panel-body">
                    <div class="row mb-5" style="margin-bottom:10px;">
                        <div class="col-md-12">
                            <form action="{{ route('tasks') }}" method="GET" class="form-inline mb-3">
                                <input type="text" name="category_name" class="form-control" placeholder="Search category"
                                    value="{{ request('category_name') }}">
                                <button type="submit" class="btn btn-primary">Filter</button>
                            </form>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="list-group mt-5">
                                @foreach ($categories as $item)
                                    <a href="#" class="list-group-item category-item" data-id="{{ $item->id }}"
                                        data-name="{{ $item->category_name }}">
                                        <p class="list-group-item-text">{{$item->category_name}}</p>
                                        <button class="btn btn-xs btn-danger pull-right open-delete-category"
                                            style="position: absolute;right: 5%;top: 20%;" data-id="{{ $item->id }}"
                                            data-name="{{ $item->category_name }}">Delete</button>
                                    </a>
                                @endforeach
                            </div>
                            <div class="text-center">
                                {{ $categories->links() }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-8">
            <div class="panel panel-primary">
                <div class="panel-heading clearfix">
                    <h3 class="panel-title pull-left">List</h3>
                    <button class="btn btn-xs btn-success pull-right">Add</button>
                </div>
                <div class="panel-body">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <td>Task Name</td>
                                <td>Category</td>
                                <td>Assigned To</td>
                                <td>Priority</td>
                                <td>Due Date</td>
                                <td>Status</td>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($tasks_user as $taskId => $taskGroup)
                                @php
                                    $first = $taskGroup->first();  // Get a representative Task_User for the task details
                                    $userNames = $taskGroup->pluck('user.name')->unique()->implode(', '); // Concatenate user names
                                @endphp
                                <tr>
                                    <td>{{ $first->task->task_name }}</td>
                                    <td>{{ $first->task->category->category_name }}</td>
                                    <td>{{ $userNames }}</td>
                                    <td>{{ $first->task->priority->description }}</td>
                                    <td>{{ $first->due_date }}</td>
                                    <td>{{ $first->status->status_name }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <!-- Modal Category -->
    <div id="ModalCategory" class="modal fade" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <form id="categoryForm" method="POST" class="form-horizontal" role="form">
                    @csrf
                    <input type="hidden" name="category_id" id="category_id" value="">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">Add Category</h4>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="category_name" class="col-md-3 control-label">Category Name</label>
                            <div class="col-md-9">
                                <input type="text" class="form-control" id="category_name" name="category_name" placeholder="Category Name" value="{{ old('category_name') }}">
                                @error('category_name')<small class="text-danger"> {{$message}} </small>@enderror
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary" id="modalSubmitBtn_Category">Save</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <!-- Modal Tasks -->
    <div id="ModalTasks" class="modal fade" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <form id="taskForm" method="POST" class="form-horizontal" role="form">
                    @csrf
                    <input type="hidden" name="task_id" id="task_id" value="">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title"></h4>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="task_name" class="col-md-3 control-label">Task Name</label>
                            <div class="col-md-9">
                                <input type="text" class="form-control" id="task_name" name="task_name" placeholder="Category Name" value="{{ old('task_name') }}">
                                @error('task_name')<small class="text-danger"> {{$message}} </small>@enderror
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="task_name" class="col-md-3 control-label">Category</label>
                            <div class="col-md-9">
                                <select class="form-control" name="category_id" id="task_category_id">
                                    <option value=""></option>
                                    @foreach ( $categories as $item )
                                        <option value="{{ $item->id }}">{{ $item->category_name }}</option>
                                    @endforeach
                                </select>
                                @error('category_id')<small class="text-danger"> {{$message}} </small>@enderror
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="task_name" class="col-md-3 control-label">Priority</label>
                            <div class="col-md-9">
                                <select class="form-control" name="priority_id" id="task_priority_id">
                                    <option value=""></option>
                                    @foreach ( $priorities as $item )
                                        <option value="{{ $item->id }}">{{ $item->description }}</option>
                                    @endforeach
                                </select>
                                @error('priority_id')<small class="text-danger"> {{$message}} </small>@enderror
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary" id="modalSubmitBtn_Tasks">Save</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    </div>

                </form>
            </div>
        </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div id="deleteModal_Category" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-md" role="document">
            <form method="POST" id="deleteCategoryForm">
                @csrf
                @method('DELETE')
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Delete Category</h4>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete <strong id="categoryNameToDelete"></strong>?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-danger">Yes, Delete</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    <div id="deleteModal_Task" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-md" role="document">
            <form method="POST" id="deleteTaskForm">
                @csrf
                @method('DELETE')
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Delete Task</h4>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete <strong id="taskNameToDelete"></strong>?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-danger">Yes, Delete</button>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    @if ($errors->has('category_name'))
        <script>
            $(document).ready(function () {
                $('#ModalCategory').modal('show');
                $('#categoryForm').attr('action', "{{ route('store-category') }}");
                $('#categoryForm').find('input[name="_method"]').remove(); // remove PUT method if any
                $('#categoryForm')[0].reset();
                $('#category_id').val('');
                $('#categoryError').text('');
                $('.modal-title').text('Add Category');
                $('#modalSubmitBtn_Category').text('Save');
            });
        </script>
    @endif
    @if ($errors->has('task_name') || $errors->has('priority_id') || $errors->has('category_id'))
    <script>
        $(document).ready(function () {
            $('#taskForm').attr('action', "{{ route('store-tasks') }}");
            $('#taskForm').find('input[name="_method"]').remove(); // remove PUT method if any
            $('#taskForm')[0].reset();
            $('#task_id').val('');
            $('#taskError').text('');
            $('.modal-title').text('Add Tasks');
            $('#modalSubmitBtn_Tasks').text('Save');
            $('#ModalTasks').modal('show');
        });
    </script>
    @endif
    @if(session('success'))
        <script>
            iziToast.success({ position: "center", title: 'System Message', message: '{{ session('success') }}' });
        </script>
    @endif
    @if(session('error'))
        <script>
            iziToast.error({ position: "center", title: 'System Message', message: '{{ session('error') }}' });
        </script>
    @endif
    <script>
        $(document).ready(function () {

            // When "Add" button clicked
            $('#addCategoryBtn').click(function () {
                ResetCategoryForm();
                $('#ModalCategory').modal('show');
            });
            $('#addTasksBtn').click(function () {
                ResetTaskForm();
                $('#ModalTasks').modal('show');
            });

            // When clicking on a category item to edit
            $(document).on('click', '.category-item', function (e) {
                e.preventDefault();

                var id = $(this).data('id');
                var name = $(this).data('name');

                // Set form action to update route with PUT method spoofing
                $('#categoryForm').attr('action', "{{ route('update-category') }}");

                // Add hidden input for method PUT if not already added
                let methodInput = $('#categoryForm').find('input[name="_method"]');
                if (methodInput.length === 0) {
                    $('#categoryForm').append('<input type="hidden" name="_method" value="PUT">');
                } else {
                    methodInput.val('PUT');
                }

                $('#category_id').val(id);
                $('#category_name').val(name);
                $('#categoryError').text('');
                $('.modal-title').text('Edit Category');
                $('#modalSubmitBtn_Category').text('Update');
                $('#ModalCategory').modal('show');
            });

            // When clicking on a task item to edit
            $(document).on('click', '.task-item', function (e) {
                e.preventDefault();

                var id = $(this).data('id');
                var name = $(this).data('name');
                var category_id = $(this).data('category_id');
                var priority_id = $(this).data('priority_id');

                // Set form action to update route with PUT method spoofing
                $('#taskForm').attr('action', "{{ route('update-tasks') }}");

                // Add hidden input for method PUT if not already added
                let methodInput = $('#taskForm').find('input[name="_method"]');
                if (methodInput.length === 0) {
                    $('#taskForm').append('<input type="hidden" name="_method" value="PUT">');
                } else {
                    methodInput.val('PUT');
                }

                $('#task_id').val(id);
                $('#task_name').val(name);
                $('#task_category_id').val(category_id);
                $('#task_priority_id').val(priority_id);
                $('#taskError').text('');
                $('.modal-title').text('Edit Task');
                $('#modalSubmitBtn_Tasks').text('Update');
                $('#ModalTasks').modal('show');
            });

            // Clear errors/input on modal close
            $('#ModalCategory').on('hidden.bs.modal', function () {
                $('#categoryForm')[0].reset();
                $('#categoryError').text('');
                $('#categoryForm').attr('action', "{{ route('store-category') }}");
                $('#categoryForm').find('input[name="_method"]').remove();
                $('.modal-title').text('Add Category');
                $('#modalSubmitBtn_Category').text('Save');
            });
            $(document).on('click', '.open-delete-category', function (e) {
                e.stopPropagation();  // Prevent bubbling to .category-item
                e.preventDefault();
                const categoryId = $(this).data('id');
                const categoryName = $(this).data('name');
                $('#categoryNameToDelete').text(categoryName);
                $('#deleteCategoryForm').attr('action', '/categories/' + categoryId);
                $('#deleteModal_Category').modal('show');
            });
            $(document).on('click', '.open-delete-task', function (e) {
                e.stopPropagation();  // Prevent bubbling to .category-item
                e.preventDefault();
                const taskId = $(this).data('id');
                const tastName = $(this).data('name');
                $('#taskNameToDelete').text(tastName);
                $('#deleteTaskForm').attr('action', '/tasks/' + taskId);
                $('#deleteModal_Task').modal('show');
            });

            function ResetCategoryForm(){
                $('#categoryForm').attr('action', "{{ route('store-category') }}");
                $('#categoryForm').find('input[name="_method"]').remove(); // remove PUT method if any
                $('#categoryForm')[0].reset();
                $('#category_id').val('');
                $('#categoryError').text('');
                $('.modal-title').text('Add Category');
                $('#modalSubmitBtn_Category').text('Save');
            }
            function ResetTaskForm(){
                $('#taskForm').attr('action', "{{ route('store-tasks') }}");
                $('#taskForm').find('input[name="_method"]').remove(); // remove PUT method if any
                $('#taskForm')[0].reset();
                $('#task_id').val('');
                $('#taskError').text('');
                $('.modal-title').text('Add Tasks');
                $('#modalSubmitBtn_Tasks').text('Save');
            }
        });
    </script>
@endsection