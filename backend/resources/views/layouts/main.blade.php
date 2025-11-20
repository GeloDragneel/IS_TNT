<!DOCTYPE html>
<html lang="en">

<head>
    <title>Task Management System</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://unpkg.com/izitoast/dist/css/iziToast.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
    <script src="https://unpkg.com/izitoast/dist/js/iziToast.min.js"></script>
</head>
<body>
    <nav class="navbar navbar-inverse">
        <div class="container-fluid">
            <div class="navbar-header">
                <a class="navbar-brand" href="#">Task Management System</a>
            </div>
            <ul class="nav navbar-nav">
                <li class="{{ request()->is('dashboard') ? 'active' : '' }}"><a href="dashboard">Dashboard</a></li>
                <li class="{{ request()->is('tasks') ? 'active' : '' }}"><a href="tasks">Tasks</a></li>
            </ul>
            <ul class="nav navbar-nav navbar-right">
                <li><a href="#"><span class="glyphicon glyphicon-user"></span> Hi, {{$data->name}}</a></li>
                <li><a href="logout"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>
            </ul>
        </div>
    </nav>
    <div class="container-fluid">
        @yield('maincontent')
    </div>
</body>

</html>