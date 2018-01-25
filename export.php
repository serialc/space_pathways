<?php 

//print_r($_POST, false);

$content = $_POST['content'];

if(empty($content)){
    exit;
}

// Outputting headers:
header("Cache-Control: ");
header("Content-type: text/plain");
header('Content-Disposition: attachment; filename="Paths.svg"');

//clean string
echo stripslashes( $content );

?>
