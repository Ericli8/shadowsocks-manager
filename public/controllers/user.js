app.controller('UserIndexController', function($scope, $http, $state) {
        $scope.setTitle('首页');
        $scope.setMenuButton('default');
        $scope.logout = function() {
            $http.post('/api/home/logout');
        };
    })
    .controller('UserAccountController', function($scope, $http, $state) {
        $scope.setTitle('我的帐户');
        $scope.setMenuButton('default');
        $scope.accountPage = function(account) {
            $state.go('user.accountPage', {
                serverName: account.server,
                accountPort: account.port
            });
        };
    })
    .controller('UserAccountPageController', function($scope, $http, $state, $stateParams, $filter) {
        $scope.setTitle('帐户详情');
        $scope.setMenuButton('user.account');

        $scope.qrCode = '';
        var b64EncodeUnicode = function(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
        };

        $scope.$watch('publicInfo.user', function() {
            $scope.init();
        }, true);

        $scope.init = function() {
            if(!$scope.publicInfo.user) {return;}
            $scope.account = $scope.publicInfo.user.account.filter(function(f) {
                return (f.server === $stateParams.serverName && +f.port === +$stateParams.accountPort);
            })[0];
            if(!$scope.account) {
                return $state.go('user.index');
            }
            $scope.qrCode = 'ss://' + b64EncodeUnicode($scope.account.method + ':' + $scope.account.password + '@' + $scope.account.address + ':' + $scope.account.port);
        };
        $scope.init();

        $scope.chart = {};
        var scaleLabel = function(chart) {
            var input = chart.value;
            if (input < 1000) {
                return input +' B';
            } else if (input < 1000000) {
                return (input/1000).toFixed(0) +' KB';
            } else if (input < 1000000000) {
                return (input/1000000).toFixed(0) +' MB';
            } else if (input < 1000000000000) {
                return (input/1000000000).toFixed(1) +' GB';
            } else {
                return input;
            }
        };
        $scope.getChart = function() {
            $scope.chart.sum = 0;
            $http.post('/api/user/flowChart', {
                server: $stateParams.serverName,
                port: $stateParams.accountPort
            }).then(function(success) {
                $scope.chart.labels = [];
                $scope.chart.series = [];
                $scope.chart.data = [[]];
                success.data.forEach(function(f, i) {
                    $scope.chart.labels[i] = (i%4===0)?$filter('date')(f.time, 'HH:mm'):'';
                    $scope.chart.data[0][i] = f.flow;
                    $scope.chart.sum += f.flow;
                });
                $scope.chart.options = {
                    pointHitDetectionRadius: 1,
                    scaleLabel: scaleLabel,
                    tooltipTemplate: scaleLabel
                };
            });
        };
        $scope.getChart();
    })
    .controller('UserChangePasswordController', function($scope, $http, $state, $window) {
        $scope.setTitle('修改密码');

        $scope.password = {};
        $scope.changePassword = function() {
            $scope.loading(true);
            $http.put('/api/user/password', $scope.password)
            .then(function(success) {
                $scope.loadingMessage({
                    message: '修改密码成功，点确定重新登陆',
                    right: function() {
                        $window.location.reload();
                    }
                });
            }, function(error) {
                $scope.loadingMessage({
                    message: '修改密码失败(' + error.status + ')',
                    right: function() {
                        $scope.loading(false);
                    }
                });
            });
        };
    })
    .controller('UserRenewController', function($scope, $http, $state) {
        $scope.setTitle('续费');
        $scope.setMenuButton('default');

        $scope.renew = {renewCode: ''};
        $scope.renewIt = function() {
            $scope.loading(true);
            $http.post('/api/user/code', {
                code: $scope.renew.renewCode
            }).then(function(success) {
                $scope.loadingMessage({
                    message: '续费码使用成功',
                    right: function() {
                        $scope.loading(false);
                    }
                });
            }, function(error) {
                $scope.loadingMessage({
                    message: '续费码使用失败',
                    right: function() {
                        $scope.loading(false);
                    }
                });
            });
        };
    })
    .controller('UserFlowController', function($scope, $http, $filter) {
        $scope.setTitle('流量统计');

        $scope.chartType = 'hour';
        $scope.account = {};
        $scope.refresh = function() {
            var promises = [];
            for(var a in $scope.account) {
                promises.push($scope.getChart(a.split(':')[0], +a.split(':')[1], $scope.chartType));
            }
            Promise.all(promises).then(function(s) {
                console.log($scope.publicInfo.user.account);
            });
        };

        $scope.$watch('account', $scope.refresh, true);

        $scope.chart = {};
        var scaleLabel = function(chart) {
            var input = chart.value;
            if (input < 1000) {
                return input +' B';
            } else if (input < 1000000) {
                return (input/1000).toFixed(0) +' KB';
            } else if (input < 1000000000) {
                return (input/1000000).toFixed(0) +' MB';
            } else if (input < 1000000000000) {
                return (input/1000000000).toFixed(1) +' GB';
            } else {
                return input;
            }
        };
        $scope.getChart = function(server, port, type) {
            var account = $scope.publicInfo.user.account.filter(function(f) {
                return (f.server === server && f.port === port);
            })[0];
            if(!account) {return Promise.reject();}
            if(!account.chart) {account.chart = {hour:{}, day: {}, week:{}};}
            $http.post('/api/user/flowChart', {
                server: server,
                port: port,
                type: type
            }).then(function(success) {
                account.chart[type] = success.data;
                return Promise.resolve();
            }, function(error) {
                return Promise.reject();
            });
        };
    })
    .controller('UserUnfinishController', function($scope) {
        $scope.setTitle('404 Not Found');
    })
;