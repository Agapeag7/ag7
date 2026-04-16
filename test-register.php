<?php
/**
 * TEST FINAL REGISTRATION AG7
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

echo "<h1>🚀 Test Final Registration AG7</h1>";
echo "<style>
    body { font-family: monospace; margin: 20px; background: #f5f5f5; }
    .ok { color: green; }
    .err { color: red; }
    .warn { color: orange; }
    pre { background: white; padding: 15px; border-radius: 5px; font-size: 12px; }
</style>";

// Étape 1: Fixer les permissions
$imgDir = __DIR__ . '/imgApp';
if (is_dir($imgDir)) {
    @chmod($imgDir, 0777);
    echo "<p>📁 Permissions imgApp/ : " . (is_writable($imgDir) ? "<span class='ok'>✅ Writable</span>" : "<span class='err'>❌ NOT writable</span>") . "</p>";
}

// Étape 2: Test d'upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['photo'])) {
    echo "<h2>Test Upload</h2>";
    
    include 'ag.class.php';
    
    $file = $_FILES['photo'];
    echo "<p>File: " . htmlspecialchars($file['name']) . "</p>";
    echo "<p>Size: " . $file['size'] . " bytes</p>";
    echo "<p>Type: " . htmlspecialchars($file['type']) . "</p>";
    echo "<p>Is uploaded: " . (is_uploaded_file($file['tmp_name']) ? "✅" : "❌") . "</p>";
    
    $result = Utils::uploadProfilePhoto($file);
    
    if ($result) {
        echo "<p class='ok'>✅ Upload RÉUSSI: $result</p>";
        
        $fullPath = $imgDir . '/' . $result;
        if (file_exists($fullPath)) {
            echo "<p>✅ Fichier existe: " . round(filesize($fullPath) / 1024, 2) . " KB</p>";
        }
    } else {
        echo "<p class='err'>❌ Upload ÉCHOUÉ</p>";
    }
    
    echo "<hr>";
    echo "<h2>Logs PHP</h2>";
    echo "<pre>";
    if (file_exists(__DIR__ . '/../test-register.log')) {
        echo htmlspecialchars(file_get_contents(__DIR__ . '/../test-register.log'));
    } else {
        echo "Aucun log trouvé";
    }
    echo "</pre>";
}

// Afficher le formulaire
echo "<h2>Formulaire</h2>";
echo "<form method='POST' enctype='multipart/form-data'>";
echo "<input type='file' name='photo' accept='image/*' required>";
echo "<button type='submit'>Tester Upload</button>";
echo "</form>";

echo "<p><a href='index.php'>← Retour</a></p>";
?>
