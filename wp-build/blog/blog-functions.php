<?php
/**
 * Shared helpers for the 2026 blog templates (template-duality-blog.php, single-post.php).
 * Lives in salon-child/duality-home/. Header, CTA and footer come from the approved homepage
 * via partials/*.html (built by build-blog.js).
 */

if (!defined('ABSPATH')) {
	exit;
}

if (!function_exists('dh_blog_live')) :

/** The new post design shows to everyone once the site launches; before that only with ?dh-preview=1. */
function dh_blog_live() {
	return (bool) get_option('duality_blog_live');
}

function dh_blog_preview() {
	return isset($_GET['dh-preview']); // phpcs:ignore WordPress.Security.NonceVerification -- read-only display switch
}

/** Post links carry the preview flag until launch, so a reviewer stays in the new design. */
function dh_post_link($post) {
	$url = get_permalink($post);
	return dh_blog_live() ? $url : add_query_arg('dh-preview', '1', $url);
}

/** Same asset handling as the homepage template: only the design's own CSS/JS load. */
function dh_blog_assets() {
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
		$dir  = get_stylesheet_directory_uri() . '/duality-home';
		$path = get_stylesheet_directory() . '/duality-home';
		wp_enqueue_style('duality-home-fonts', $dir . '/fonts/local.css', [], (string) filemtime($path . '/fonts/local.css'));
		wp_enqueue_style('duality-home', $dir . '/home.css', ['duality-home-fonts'], (string) filemtime($path . '/home.css'));
		wp_enqueue_style('duality-blog', $dir . '/blog.css', ['duality-home'], (string) filemtime($path . '/blog.css'));
		wp_enqueue_script('duality-home', $dir . '/home.js', [], (string) filemtime($path . '/home.js'), true);
	}, 999);

	remove_action('wp_head', 'salon_salon_style', 99);
	remove_action('wp_head', 'salon_wp_head');
	remove_action('wp_footer', 'salon_print_inline_script_style');
	remove_action('wp_head', 'wp_custom_css_cb', 101);

	$late = function () {
		foreach (['rs-plugin-settings', 'global-styles', 'classic-theme-styles', 'wp-block-library', 'core-block-supports'] as $handle) {
			wp_dequeue_style($handle);
		}
	};
	add_action('wp_print_styles', $late, 999);
	add_action('wp_print_footer_scripts', $late, 1);
}

function dh_partial($name) {
	$html = file_get_contents(get_stylesheet_directory() . '/duality-home/partials/' . $name . '.html');
	return str_replace('{{SITE}}', esc_url(home_url('/')), $html);
}

function dh_head($body_class) {
	?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add('js');</script>
<link rel="preload" href="<?php echo esc_url(get_stylesheet_directory_uri() . '/duality-home/fonts/f3.woff2'); ?>" as="font" type="font/woff2" crossorigin>
<?php wp_head(); ?>
</head>
<body <?php body_class('duality-home ' . $body_class); ?>>
<?php
	wp_body_open();
	echo dh_partial('header'); // phpcs:ignore WordPress.Security.EscapeOutput -- trusted theme partial
}

function dh_foot() {
	echo dh_partial('cta'); // phpcs:ignore WordPress.Security.EscapeOutput
	echo dh_partial('footer'); // phpcs:ignore WordPress.Security.EscapeOutput
	wp_footer();
	echo "\n</body>\n</html>\n";
}

/** Topic label: the post's first real category ("Featured" is a flag, not a topic). */
function dh_post_topic($post) {
	foreach (get_the_category($post->ID) as $cat) {
		if (!in_array($cat->slug, ['featured', 'uncategorized'], true)) {
			return $cat->slug === 'haircare' ? 'Hair Care' : $cat->name;
		}
	}
	return 'Salon Notes';
}

/** Featured image, or a salon photo for posts that never had one. */
function dh_post_image($post, $size, $attrs = []) {
	$id = get_post_thumbnail_id($post);
	if (!$id) {
		$imgs = get_option('duality_home_images');
		$id   = is_array($imgs) && !empty($imgs['group-3']) ? (int) $imgs['group-3'] : 0;
	}
	if (!$id) {
		return '';
	}
	$attrs = array_merge(['alt' => get_the_title($post), 'loading' => 'lazy', 'decoding' => 'async'], $attrs);
	return wp_get_attachment_image($id, $size, false, $attrs);
}

/** Plain-text body with the title repeated as the first line removed (older posts open that way). */
function dh_post_text($post) {
	$text  = html_entity_decode(wp_strip_all_tags(strip_shortcodes($post->post_content)), ENT_QUOTES, 'UTF-8');
	$text  = trim(preg_replace('/\s+/u', ' ', str_replace("\xC2\xA0", ' ', $text)));
	$title = html_entity_decode(get_the_title($post), ENT_QUOTES, 'UTF-8');
	if ($title !== '' && stripos($text, $title) === 0) {
		$text = ltrim(substr($text, strlen($title)));
	}
	return $text;
}

function dh_post_excerpt($post, $words = 24) {
	if (has_excerpt($post)) {
		return wp_trim_words(get_the_excerpt($post), $words);
	}
	return wp_trim_words(dh_post_text($post), $words);
}

function dh_reading_time($post) {
	return max(1, (int) ceil(str_word_count(dh_post_text($post)) / 200));
}

/**
 * Display-only tidy-up of older post HTML (pasted from Word). The stored posts are not changed.
 * - content H1s become H2s, so the page keeps a single H1 (the post title)
 * - empty spacer paragraphs and Word's empty formatting spans are dropped
 * - a bolded first line that repeats the title is dropped
 */
function dh_clean_content($post) {
	$html = apply_filters('the_content', $post->post_content);
	$html = preg_replace('#<(/?)h1\b#i', '<$1h2', $html);
	$html = preg_replace('#<span data-ccp-props="[^"]*">\s*</span>#i', '', $html);
	// Paragraphs and headings with no visible text (spacers, even when wrapped in Word's spans)
	$html = preg_replace_callback('#<(p|h[2-6])\b[^>]*>(.*?)</\1>#is', function ($m) {
		if (preg_match('#<(img|iframe|video|svg)\b#i', $m[2])) {
			return $m[0];
		}
		$text = str_replace(["\xC2\xA0", '&nbsp;', '&#160;'], ' ', wp_strip_all_tags($m[2]));
		return trim($text) === '' ? '' : $m[0];
	}, $html);
	// Older posts tag whole paragraphs as headings (H1-H5) for size. Sentences become paragraphs;
	// genuine short headings (labels, questions, "1) Tip name") share one subheading style.
	$html = preg_replace_callback('#<(h[2-6])\b[^>]*>(.*?)</\1>#is', function ($m) {
		$inner = $m[2];
		$text  = html_entity_decode(wp_strip_all_tags($inner), ENT_QUOTES, 'UTF-8');
		$text  = trim(preg_replace('/\s+/u', ' ', str_replace(["\xC2\xA0", '&nbsp;'], ' ', $text)));
		$short       = mb_strlen($text) <= 90;
		$numbered    = mb_strlen($text) <= 120 && preg_match('/^\d+[).]\s/u', $text); // "1) Always use a heat protectant." is a tip title
		$is_sentence = !$numbered && (!$short
			|| preg_match('/[.!]["\x{201D}\x{2019})]*$/u', $text)
			|| preg_match('/[.!?]\s+\p{Lu}/u', $text));
		return $is_sentence ? '<p>' . $inner . '</p>' : '<h3>' . $inner . '</h3>';
	}, $html);
	// Bold wrapped around an entire paragraph or heading adds nothing; drop it.
	$html = preg_replace('#<(p|h3)>\s*<(b|strong)>((?:(?!</?(?:b|strong)\b).)*)</\2>\s*</\1>#is', '<$1>$3</$1>', $html);

	$title = preg_quote(wp_strip_all_tags(get_the_title($post)), '#');
	$html  = preg_replace('#^\s*<p>\s*<(b|strong)>\s*' . $title . '\s*</\1>\s*</p>#iu', '', $html, 1);
	return $html;
}

function dh_post_card($post, $class = '') {
	$link = esc_url(dh_post_link($post));
	ob_start();
	?>
	<article class="post-card <?php echo esc_attr($class); ?>">
		<a href="<?php echo $link; ?>" class="post-card__img" tabindex="-1" aria-hidden="true"><?php echo dh_post_image($post, 'large'); ?></a>
		<div class="post-card__body">
			<div class="post-card__meta"><span><?php echo esc_html(dh_post_topic($post)); ?></span><span><?php echo esc_html(get_the_date('M j, Y', $post)); ?></span></div>
			<h3><a href="<?php echo $link; ?>"><?php echo esc_html(get_the_title($post)); ?></a></h3>
			<p><?php echo esc_html(dh_post_excerpt($post, $class === 'is-feature' ? 40 : 22)); ?></p>
			<a href="<?php echo $link; ?>" class="post-card__more">Read the article <span class="ln"></span></a>
		</div>
	</article>
	<?php
	return ob_get_clean();
}

endif;
