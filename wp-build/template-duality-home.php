<?php
/**
 * Template Name: Duality Home (2026 design)
 *
 * Full-width template for the approved 2026 homepage design. Renders its own header,
 * sections and footer from the page content, and loads only its own CSS/JS so the
 * Salon theme's styles don't override the design. Content is raw HTML: edit it in the
 * Classic Editor "Text" tab (not WPBakery, which would rewrite the markup).
 */

if (!defined('ABSPATH')) {
	exit;
}

add_action('wp_enqueue_scripts', function () {
	$keep_styles  = ['admin-bar', 'dashicons', 'contact-form-7'];
	$keep_scripts = ['admin-bar', 'contact-form-7', 'swv', 'wpcf7-recaptcha', 'google-recaptcha', 'wp-i18n', 'wp-hooks'];

	foreach (wp_styles()->queue as $handle) {
		if (!in_array($handle, $keep_styles, true)) {
			wp_dequeue_style($handle);
		}
	}
	foreach (wp_scripts()->queue as $handle) {
		if (!in_array($handle, $keep_scripts, true)) {
			wp_dequeue_script($handle);
		}
	}

	$dir = get_stylesheet_directory_uri() . '/duality-home';
	$ver = '1.0.0';
	wp_enqueue_style('duality-home-fonts', $dir . '/fonts/local.css', [], $ver);
	wp_enqueue_style('duality-home', $dir . '/home.css', ['duality-home-fonts'], $ver);
	wp_enqueue_script('duality-home', $dir . '/home.js', [], $ver, true);
}, 999);

// The Salon theme prints option-based CSS/JS (body backgrounds, fonts, colors) for its own
// layout; on this page those rules recolor the new design, so they are switched off here.
remove_action('wp_head', 'salon_salon_style', 99);
remove_action('wp_head', 'salon_wp_head');
remove_action('wp_footer', 'salon_print_inline_script_style');
// Customizer "Additional CSS" also targets the old theme layout.
remove_action('wp_head', 'wp_custom_css_cb', 101);

// Some plugins (Slider Revolution) and core global styles enqueue after wp_enqueue_scripts.
$duality_late_dequeue = function () {
	foreach (['rs-plugin-settings', 'global-styles', 'classic-theme-styles', 'wp-block-library', 'core-block-supports'] as $handle) {
		wp_dequeue_style($handle);
	}
};
add_action('wp_print_styles', $duality_late_dequeue, 999);
add_action('wp_print_footer_scripts', $duality_late_dequeue, 1);

$content = get_post_field('post_content', get_queried_object_id());
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add('js');</script>
<link rel="preload" href="<?php echo esc_url(get_stylesheet_directory_uri() . '/duality-home/fonts/f3.woff2'); ?>" as="font" type="font/woff2" crossorigin>
<?php wp_head(); ?>
</head>
<body <?php body_class('duality-home'); ?>>
<?php
wp_body_open();
echo wp_filter_content_tags(do_shortcode($content)); // phpcs:ignore WordPress.Security.EscapeOutput -- trusted page content
wp_footer();
?>
</body>
</html>
