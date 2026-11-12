<?php
/**
 * Single blog post in the approved 2026 design.
 *
 * Until the site launches (option duality_blog_live), visitors keep the Salon theme's post layout;
 * the new design shows only with ?dh-preview=1. Flip the option at launch to switch every post.
 */

if (!defined('ABSPATH')) {
	exit;
}

require_once get_stylesheet_directory() . '/duality-home/blog-functions.php';

if (!dh_blog_live() && !dh_blog_preview()) {
	$fallback = locate_template('single.php');
	if ($fallback) {
		include $fallback;
		return;
	}
}

dh_blog_assets();
the_post();
$post_obj = get_post();
$blog_url = home_url('/blog/');
$related  = get_posts([
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'numberposts'         => 3,
	'post__not_in'        => [$post_obj->ID],
	'ignore_sticky_posts' => true,
]);
$cover = dh_post_image($post_obj, 'full', ['loading' => 'eager', 'fetchpriority' => 'high', 'sizes' => '(max-width: 1240px) 100vw, 1240px']);

dh_head('duality-blog duality-post');
?>

<article class="post">
  <header class="post-hero on-dark<?php echo $cover ? ' has-cover' : ''; ?>">
    <div class="wrap">
      <div class="eyebrow"><a href="<?php echo esc_url(dh_blog_live() ? $blog_url : add_query_arg('dh-preview', '1', $blog_url)); ?>">The Duality Journal</a><span class="sep">·</span><?php echo esc_html(dh_post_topic($post_obj)); ?></div>
      <h1><?php the_title(); ?></h1>
      <p class="post-meta">By Duality Salon<span class="sep">·</span><time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date('F j, Y')); ?></time><span class="sep">·</span><?php echo (int) dh_reading_time($post_obj); ?> min read</p>
    </div>
  </header>

  <?php if ($cover) : ?>
    <div class="wrap post-cover"><?php echo $cover; // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
  <?php endif; ?>

  <div class="post-body">
    <div class="entry">
      <?php echo dh_clean_content($post_obj); // phpcs:ignore WordPress.Security.EscapeOutput -- post content ?>
    </div>

    <aside class="post-author">
      <?php
      $imgs = get_option('duality_home_images');
      if (is_array($imgs) && !empty($imgs['sue-leah'])) {
          echo wp_get_attachment_image((int) $imgs['sue-leah'], 'thumbnail', false, ['alt' => 'Sue and Leah, owners of Duality Salon', 'loading' => 'lazy']);
      }
      ?>
      <div>
        <div class="label">Written by</div>
        <h3>The Duality Salon team</h3>
        <p>Sue and Leah lead a mother-daughter team of five stylists at 1606 Hopkins Road in Williamsville, NY.</p>
        <a href="https://login.meevo.com/DualitySalonBuffalo/ob?locationId=105068" target="_blank" rel="noopener" class="post-author__link">Book an appointment <span class="ln"></span></a>
      </div>
    </aside>
  </div>
</article>

<?php if ($related) : ?>
<section class="post-related">
  <div class="wrap">
    <div class="head-row">
      <div>
        <div class="eyebrow">Keep reading</div>
        <h2>More from the <em>journal</em></h2>
      </div>
      <a href="<?php echo esc_url(dh_blog_live() ? $blog_url : add_query_arg('dh-preview', '1', $blog_url)); ?>" class="btn ghost">All articles <span class="arr">→</span></a>
    </div>
    <div class="post-grid">
      <?php foreach ($related as $p) { echo dh_post_card($p); } // phpcs:ignore WordPress.Security.EscapeOutput ?>
    </div>
  </div>
</section>
<?php endif; ?>

<?php
dh_foot();
