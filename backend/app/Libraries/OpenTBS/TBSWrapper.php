<?php

namespace App\Libraries\OpenTBS;

// Manually include the required files
require_once __DIR__ . '/tbs_class.php';
require_once __DIR__ . '/tbs_plugin_opentbs.php';

class TBSWrapper extends \clsTinyButStrong {
    public function __construct() {
        parent::__construct();
        $this->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);
    }
}
