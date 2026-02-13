package muzicc

deny[msg] {
    contains(input.image, ":latest")
    msg = "Using latest tag is not allowed"
}

deny[msg] {
    not contains(input.image, ":")
    msg = "Image must have a tag"
}

allow {
    count(deny) == 0
}
