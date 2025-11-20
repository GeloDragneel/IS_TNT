<!DOCTYPE html>
<html lang="en">
<head>
    <title>Task Management System | Login</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
</head>
<body>
    <div class="jumbotron text-center">
        <h1>Registration Portal</h1>
        <p>Task Management System</p>
    </div>
    <div class="container">
      
        <div class="mainbox col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
            <div class="panel panel-info">
                <div class="panel-heading">
                    <div class="panel-title">Sign Up</div>
                    <div style="float:right; font-size: 85%; position: relative; top:-10px"><a id="signinlink" href="login">Sign In</a></div>
                </div>
                <div class="panel-body">
                    <form action="{{route('register-user')}}" method="POST" id="signupform" class="form-horizontal">
                        @if(Session::has('success'))
                        <div class="alert alert-success">{{ Session::get('success') }}</div>
                        @endif
                        @if(Session::has('error'))
                        <div class="alert alert-danger">{{ Session::get('error') }}</div>
                        @endif
                        @csrf
                        <div class="form-group">
                            <label for="email" class="col-md-4 control-label">Email</label>
                            <div class="col-md-8">
                                <input type="email" class="form-control" name="email" placeholder="Email Email" value="{{ old('email') }}">
                                @error('email')<small class="text-danger"> {{$message}} </small>@enderror
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="name" class="col-md-4 control-label">Name</label>
                            <div class="col-md-8">
                                <input type="text" class="form-control" name="name" placeholder="Enter Name" value="{{ old('name') }}">
                                @error('name')<small class="text-danger"> {{$message}} </small>@enderror
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="password" class="col-md-4 control-label">Password</label>
                            <div class="col-md-8">
                                <input type="password" class="form-control" name="password" placeholder="Password">
                                @error('password')<small class="text-danger"> {{$message}} </small>@enderror
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="col-md-offset-4 col-md-9">
                                <button id="btn-signup" type="submit" class="btn btn-info"><i class="icon-hand-right"></i> &nbsp Sign Up</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</body>

</html>