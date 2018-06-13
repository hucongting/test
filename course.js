$(function() {
  Date.prototype.Format = function(fmt) {
    //author: meizz
    var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "h+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度
      S: this.getMilliseconds(), //毫秒
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length)
      );
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1
            ? o[k]
            : ("00" + o[k]).substr(("" + o[k]).length)
        );
    return fmt;
  };
  // 简易轮播
  $.fn.slider = function(obj) {
    /*
        obj = {
        	next: '',
        	prev: '',
        	count: 3,
        	intv: 0
        }
        */
    this.css("left", 0);
    var items = this.children(),
      itemWidth =
        items.outerWidth() +
        parseFloat(items.css("marginLeft")) +
        parseFloat(items.css("marginRight")),
      totalWidth = itemWidth * items.length,
      parentWidth = this.parent().innerWidth(),
      maxMove = totalWidth - parentWidth,
      that = this,
      leftIndex = 0, // 视野中最左边元素的索引
      isToNext = true; // 自动移动的方向是否是向右
    if (maxMove < itemWidth) return;
    this.width(totalWidth);
    if (this.data("bind")) return;
    this.data("bind", 1); // 标记绑定 防止重复
    autoSlider(); // 开启自动滚动
    obj.count = obj.count || 3;
    obj.next && $(obj.next).click(toNext);
    obj.prev && $(obj.prev).click(toPrev);

    function moveDistance(direct) {
      items = that.children();
      var theIndex = leftIndex + direct * obj.count;
      leftIndex = Math.max(0, Math.min(theIndex, items.length - obj.count));
      return leftIndex;
    }

    function toNext() {
      var index = moveDistance(1);
      that.stop(true).animate({ left: "-" + index * itemWidth });
      return index < items.length - obj.count;
    }

    function toPrev() {
      var index = moveDistance(-1);
      that.stop(true).animate({ left: "-" + index * itemWidth });
      return index > 0;
    }

    function autoSlider() {
      if (!obj.intv) return;
      var fn = isToNext ? toNext : toPrev;
      that.timer = setTimeout(function() {
        if (!fn()) isToNext = !isToNext;
        autoSlider();
      }, obj.intv);
    }

    this.hover(
      function() {
        clearTimeout(that.timer);
      },
      function() {
        autoSlider();
      }
    );
    return this;
  };

  var id = $("#courseId").val();
  var save = localStorage.playSave || "{}";
  var obj = {};
  try {
    obj = JSON.parse(save);
  } catch (e) {}
  if (obj[id]) {
    $(".video-course-play")
      .text("继续学习")
      .attr("href", "/video/" + id + "?videoId=" + obj[id]);
  }

  // 6101 显示进入教室
  $("#live-status").val() == 6101 && $("#applyButton").text("进入教室");
  if (!isEmpty(token)) {
    $.ajax({
      url: "/api/interaction/checkSignupCourse",
      type: "POST",
      data: { courseId: id },
      dataType: "json",
      success: function(data) {
        if (data.data.result == 1 || data.data.result == 10) {
          $("#applyImg").removeClass("none"); //显示已报名图标
          $("#gotoStudy").removeClass("none"); // 显示进入教室图标
          $("#vipApplyButton").addClass("none"); // vip立即购买
          $(".yhj,.setMeal-choice,.SetMeal-list").hide(); // 隐藏优惠券、套餐相关
          //   $("div[name='videoDiv']").each(function() {
          //     $(this).show();
          //   });
        } else {
          $("#vipApplyButton").removeClass("none");
          $("#applyButton").removeClass("none");
          $("#gotoStudy").addClass("none");
          //   $("div[name='videoDiv']").each(function() {
          //     $(this).hide();
          //   });
        }
      },
    });
  } else {
    $("#applyButtonNone").text("报名上课");
    $(".golive").hide();
    $("#applyButton").removeClass("none");
    $("#have").addClass("none");
    $("#not").removeClass("none");
  }

  //显示登录弹窗
  $.ajax({
    url: "/user/loginDiv.html",
    success: function(data) {
      $("#loginDiv").html(data);
    },
  });

  var id = $(".erweiMa_courseId").val();
  $("#erweiMa").qrcode({
    render: "canvas",
    text: "https://" + location.hostname + "/course/" + id,
    width: "96", //二维码的宽度
    height: "96", //二维码的高度
    background: "#ffffff", //二维码的后景色
    foreground: "#000000", //二维码的前景色
    src: "/res/images/favicon2.ico", //二维码中间的图片
  });

  $(".yhj-bg").on("click", ".get-coupon", function() {
    var cid = $(this).data("id"),
      that = $(this);
    that.removeClass("not-yet get-coupon").text("已领取");
    $.post("/api/coupon/receiveCoupon", { couponId: cid, terminalType: 4 })
      .then(function(res) {
        return res.status ? $.Deferred().reject(res) : layer.msg("领券成功");
      })
      .fail(function(err) {
        if (err.status == 6101) tologin();
        that.addClass("not-yet get-coupon").text("领取");
        layer.msg(err.msg || "领券失败");
      });
  });

  // 套餐展示选项卡点击切换
  var sliderWrap = $(".setmeal-wrap"); // 轮播wrap
  var lis = $(".SetMeal-listHead>li");
  lis.click(function() {
    lis.removeClass("cur");
    $(this).addClass("cur");
    var pid = $(this).data("pid");
    if (!ALL_PACKAGE[pid]) return;
    var html = "";
    var total = 0;
    if (ALL_PACKAGE[pid].courses.length < 5) {
      $(".slider-package").css("display", "none");
    } else {
      $(".slider-package").css("display", "block");
    }
    $.each(ALL_PACKAGE[pid].courses, function(index, course) {
      total += parseFloat(course.price || 0);
      html +=
        '<div class="SetMeal-Banner">' +
        '<a href="/course/' +
        course.id +
        '">' +
        '<img src="' +
        ossHome +
        course.cover +
        '!mall_course_a">' +
        "</a><h1 title=" +
        course.title +
        "> " +
        course.title +
        "</h1>" +
        "<h2>报名人数：<span>" +
        course.applyNum +
        "</span></h2>" +
        "<h3>" +
        (course.mainTeacher || "") +
        "</h3>" +
        "</div>";
    });
    total = total.toFixed(2);
    $(".setmeal-wrap").html(html);
    $(".buy-btn")
      .eq(1)
      .data("bid", pid);
    var discount = (total - ALL_PACKAGE[pid].price).toFixed(2);
    setPrice(total, discount, ALL_PACKAGE[pid].price);
    sliderWrap.slider({
      next: ".package-toright",
      prev: ".package-toleft",
      count: 4,
      intv: 3000,
    });
  });
  lis.eq(0).click();
  var packages = $(".pakages>a");
  packages.click(function() {
    packages.removeClass("cur");
    $(this).addClass("cur");
    var pid = $(this).data("pid");
    $(".buy-btn")
      .eq(0)
      .data("type", pid ? 6811 : 6810)
      .data(
        "bid",
        pid ||
          $(".buy-btn")
            .eq(0)
            .data("course")
      );
    pid &&
      $(".SetMeal-listHead>li[data-pid=" + $(this).data("pid") + "]").click();
  });
  // 优惠券收起展开按钮

  $(".yhj-bg").hover(
    function() {
      $(this).addClass("spread");
    },
    function() {
      $(this).removeClass("spread");
    }
  );

  function setPrice(total, discount, packagePrice) {
    $(".total-price").text(parseFloat(total));
    $(".discount").text(parseFloat(discount));
    $(".SetMeal-list-gm>h1")[0].firstChild.nodeValue =
      "套餐价 : ¥" + packagePrice;
  }
  $(".buy-btn").click(function() {
    new Topay($(this).data("type"), $(this).data("bid"));
  });

  function Topay(type, id) {
    this.type = type;
    this.id = id;
    this.couponId = "";
    this.orderUrl =
      "/orders/submitOrder?courseId=" + id + "&type=" + type + "&couponId=";
    $(".BuyingCourseBtn2").click(function() {
      $(".BuyingCourse-bg").css("display", "none");
    });
    var that = this;
    $(".coupon-list")
      .filter(function() {
        return !$(this).data("isbind");
      })
      .on("click", ".BuyingCourse-list", function(e) {
        var haveSelect = $(this).is(".BuyingCourse-listClick");
        $(".BuyingCourse-list").removeClass("BuyingCourse-listClick");
        if (haveSelect) {
          that.couponId = "";
        } else {
          $(this).addClass("BuyingCourse-listClick");
          that.couponId = $(this).data("id");
        }
      })
      .data("isbind", 1);
    $(".BuyingCourseBtn1").click(function() {
      $(".BuyingCourse-bg").css("display", "none");
      location.href = that.orderUrl + that.couponId;
    });
    if (isEmpty(token)) {
      tologin();
    } else {
      this.init();
    }
  }

  Topay.prototype.init = function() {
    $(".BuyingCourse-course,.BuyingCourse-courseTc").css("display", "none");
    (this.type == 6810 ? this.courseOrder() : this.packageOrder()).then(
      function() {
        $(".BuyingCourse-bg").css("display", "block");
      }
    );
    $(".confirm-price").text("￥" + this.price);
  };

  Topay.prototype.courseOrder = function() {
    this.price = COURSE_INFO.price;
    //不分班没有开课时间
    $(".single-course-time").css("display", "none");
    $(".single-course-title").text(COURSE_INFO.title);
    $(".single-course-cover").attr("src", COURSE_INFO.cover);
    var self = this;
    return this.getCoupons().then(function(data) {
      var html = "",
        coupons = data.canUseCoupons || [],
        maxAmount = 0;
      for (var i = 0; i < coupons.length; i++) {
        if (coupons[i].amount > maxAmount) {
          maxAmount = coupons[i].amount;
          self.couponId = coupons[i].id;
        }
      }
      for (var i = 0; i < coupons.length; i++) {
        var coupon = coupons[i];
        var d = new Date(),
          addClass =
            self.couponId == coupon.id ? " BuyingCourse-listClick" : "";
        d.setTime(coupon.useEndTime);
        html +=
          '<div class="BuyingCourse-list' +
          addClass +
          '" data-id="' +
          coupon.id +
          '">' +
          "<h2>满" +
          coupon.limitAmount +
          "元减" +
          coupon.amount +
          "元</h2>" +
          "<h3>" +
          d.Format("yyyy-MM-dd hh:mm:ss") +
          "</h3>" +
          '<img src="/res/images/BuyingCourse-list.png" alt="" />' +
          "</div>";
      }
      $(".not-have-coupon")
        .css("display", data.canUseCoupons ? "none" : "inline")
        .parent()
        .css("display", data.canNotUseCoupon ? "block" : "none");
      $(".BuyingCourse-banner").css(
        "display",
        data.canNotUseCoupon && data.canUseCoupons ? "block" : "none"
      );
      $(".coupon-list")
        .html(html)
        .slider({
          next: ".BuyingCourse-banner-right",
          prev: ".BuyingCourse-banner-left",
          count: 3,
        });
      $(".BuyingCourse-course").css("display", "block");
    });
  };

  Topay.prototype.packageOrder = function() {
    this.price = ALL_PACKAGE[this.id].price;
    var packid = this.id;
    return this.getPackageCourses().then(function(courses) {
      var html = "";
      for (var i = 0; i < courses.length; i++) {
        var course = courses[i];
        html +=
          '<div class="BuyingCourse-course1">' +
          '<img src="' +
          ossHome +
          course.cover +
          "!mall_course_a" +
          '" alt="" />' +
          "<h2>" +
          course.title +
          "</h2>" +
          "<h3>开课时间：" +
          new Date(course.startTime).Format("yyyy-MM-dd hh:mm:ss") +
          "</h3>" +
          "</div>";
      }
      $(".package-course-list").html(html);
      $(".package-title").text(ALL_PACKAGE[packid].title);
      $(".BuyingCourse-courseTc").css("display", "block");
    });
  };

  Topay.prototype.getCoupons = function() {
    return $.post("/api/order/getConfirmationOrder", {
      id: this.id,
      goodsType: 6810,
      terminalType: 4,
    })
      .then(function(res) {
        return res.status ? $.Deferred().reject(res) : res.data;
      })
      .fail(function(err) {
        layer.msg(err.msg || "获取优惠券失败");
        return [];
      });
  };

  Topay.prototype.getPackageCourses = function() {
    return $.Deferred().resolve(ALL_PACKAGE[this.id].courses);
  };

  $(document.body).on("click", function(e) {
    if ($(e.originalEvent.target).is(".no-class")) {
      layer.msg("请联系老师为您分班");
    } else if ($(e.originalEvent.target).is(".is-over")) {
      layer.msg("您的班期已结束");
    }
  });

  $(".class-list-select").click(function() {
    $(this).toggleClass("active");
  });

  $(".class-list-item").click(function() {
    $(".class-time").text(
      $(this)
        .find(".class-select-time")
        .text()
    );
    $(".class-period").text($(this).data("period"));
    var classId = $(this).data("class");
    queryClassChapter(classId).then(function(res) {
      var chapters = res.data.chapters;
      $(".class-teacher").text("主讲老师：" + chapters[0].teacherName);
      var lis = "",
        courseId = $("#courseId").val(),
        courseType = $("#courseType").val();
      $.each(chapters, function(index, chapter) {
        lis += '<li><p class="cour-catalog">' + chapter.title + "</p>";
        if (chapter.liveStatusDicFk === 6101) {
          lis +=
            '<a href="javascript:void(0);" class="ended ended-blue fr" onclick="onLive(' +
            courseId +
            "," +
            courseType +
            "," +
            (chapter.classId || "''") +
            ')"><i class="icon cata-live"></i>\u6B63\u5728\u4E0A\u8BFE</a>';
        } else if (chapter.liveStatusDicFk === 6102) {
          lis += '<span class="ended fr">直播已结束</span>';
        } else {
          lis += '<span class="ended fr">开课时间：';
          if (chapter.startDate) {
            lis += new Date(chapter.startDate).Format("yyyy-MM-dd");
          }
          if (chapter.startTime) {
            lis += " " + new Date(chapter.startTime).Format("hh:mm:ss");
          }
        }
        if (chapter.vedios.length) {
          var vids = "";
          $.each(chapter.vedios, function(index, v) {
            vids +=
              '<div class="cour-catalogDiv"><i><img src="https://res.shiguangkey.com/res/images/biankuang.png"></i>\n<a href="/video/' +
              chapter.courseIdFk +
              "?videoId=" +
              v.videoId +
              "&classId=" +
              chapter.classId +
              '" class="catalog-click" target="_blank"><b class="catalive-img"></b><span title="' +
              v.videoName +
              '">' +
              v.videoName +
              "</span></a></div>";
          });
          lis +=
            '<div class="ended-div"  name="videoDiv">' +
            vids +
            '<div class="clear"></div></div>';
        }
        lis += "</li>";
      });
      $(".class-chapter-list").html(lis);
    });
  });

  function queryClassChapter(classId) {
    return $.post("/api/course/queryChatperForFront", {
      courseId: $("#courseId").val(),
      classId: classId,
      terminalType: 4,
    });
  }
});

function onCollectCourse(status, id) {
  if (!isEmpty(token)) {
    $.ajax({
      url: "/api/interaction/collectCourse",
      type: "POST",
      data: { courseId: id, status: status },
      dataType: "json",
      success: function(data) {
        if (data.data.result == 1) {
          if (status == 0) {
            $("#have").removeClass("none");
            $("#not").addClass("none");
          } else if (status == 1) {
            $("#not").removeClass("none");
            $("#have").addClass("none");
          }
        }
      },
    });
  } else {
    toLogin(function(data) {
      location.reload(); //刷新当前页面
    });
  }
}

function goTolive(courseId, courseType) {
  //点击进入直播

  //检查是否已报名
  if ($("#applyImg").hasClass("none")) {
    //没报名
    if (!isEmpty(token)) {
      w = window.open("");
      $.ajax({
        url: "/api/interaction/signupCourse",
        type: "POST",
        data: { courseId: courseId, status: 0 },
        dataType: "json",
        success: function(data) {
          if (data.data.result == 1) {
            var public_applyNum = parseInt($("#public_applyNum").text()) + 1;
            $("#public_applyNum").text(public_applyNum);
            $("#applyButtonNone").removeClass("none");
            $("#applyImg").removeClass("none");
            $("#applyButton").addClass("none");
            $("#gotoStudy").removeClass("none");
            w.location.href =
              live_url + "?courseId=" + courseId + "&token=" + token;
          }
        },
      });
    } else {
      toLogin(function(data) {
        location.reload(); //刷新当前页面
      });
    }
  } else {
    if (!isEmpty(token)) {
      onLive(courseId, courseType);
    } else {
      toLogin(function(data) {
        location.reload(); //刷新当前页面
      });
    }
  }
}

function onSignupCourse(status, id) {
  if (!isEmpty(token)) {
    $.ajax({
      url: "/api/interaction/signupCourse",
      type: "POST",
      data: { courseId: id, status: status },
      dataType: "json",
      success: function(data) {
        if (data.status === 6101) {
          tologin();
          return;
        }
        if (data.data.result == 1) {
          var public_applyNum = parseInt($("#public_applyNum").text()) + 1;
          $("#public_applyNum").text(public_applyNum);
          $("#applyButtonNone").removeClass("none");
          $("#applyImg").removeClass("none");
          $("#applyButton").addClass("none");
          $("#gotoStudy").removeClass("none");
          $("#applyButton").text("进入教室");
          if ($("#live-status").val() == 6101) location.href = "/live/" + id;
          /*$("div[name='videoDiv']").each(function() {
                        $(this).show();
                    });*/
        }
      },
    });
  } else {
    toLogin(function(data) {
      location.reload(); //刷新当前页面
    });
  }
}

//关闭弹窗
function closeNone() {
  $("#user_detail").addClass("none");
  $("#user_phone").addClass("none");
  $(".mask").addClass("none");
}

//电话弹框
function starPhone() {
  $("#user_phone").removeClass("none");
  $(".mask").removeClass("none");
}

//跳转vip课程付款
function onVipStart(id) {
  if (!isEmpty(token)) {
    location.href = "/orders/submitOrder?courseId=" + id;
  } else {
    toLogin(function(data) {
      location.reload(); //刷新当前页面
    });
  }
}
